import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabaseServer';

// GET: Fetch friend requests and friends list
export async function GET(request: NextRequest) {
  try {
    const supa = getSupabaseForRequest(request);
    const { data: userRes } = await supa.auth.getUser();
    const userId = userRes.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all'; // 'all', 'sent', 'received', 'friends'

    if (type === 'friends') {
      // Get all accepted friend relationships
      // First get the friend requests
      const { data: acceptedRequests, error: acceptedError } = await supa
        .from('friend_requests')
        .select('*')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (acceptedError) {
        console.error('Error fetching friends:', acceptedError);
        return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
      }

      // Get friend user IDs
      const friendUserIds = (acceptedRequests || []).map(req => 
        req.requester_id === userId ? req.receiver_id : req.requester_id
      );

      // Get profiles for friend user IDs (need to convert UUID to text for comparison)
      const friendUserIdsArray = friendUserIds.length > 0 ? friendUserIds : ['00000000-0000-0000-0000-000000000000'];
      const { data: friendProfiles, error: profilesError } = await supa
        .from('profiles')
        .select('*')
        .or(friendUserIdsArray.map(id => `user_id.eq.${id}`).join(','));

      if (profilesError) {
        console.error('Error fetching friend profiles:', profilesError);
        return NextResponse.json({ error: 'Failed to fetch friend profiles' }, { status: 500 });
      }

      // Transform to include request info
      const friends = (acceptedRequests || []).map(req => {
        const friendUserId = req.requester_id === userId ? req.receiver_id : req.requester_id;
        const friendProfile = (friendProfiles || []).find(p => p.user_id === friendUserId);
        return {
          id: req.id,
          friend_user_id: friendUserId,
          friend_profile: friendProfile || null,
          created_at: req.created_at,
          updated_at: req.updated_at
        };
      });

      return NextResponse.json(friends);
    } else if (type === 'sent') {
      // Get sent requests (pending)
      const { data: sentRequests, error: sentError } = await supa
        .from('friend_requests')
        .select('*')
        .eq('requester_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Get receiver profiles
      if (sentRequests && sentRequests.length > 0) {
        const receiverIds = sentRequests.map(req => req.receiver_id);
        const receiverIdsArray = receiverIds.length > 0 ? receiverIds : ['00000000-0000-0000-0000-000000000000'];
        const { data: receiverProfiles } = await supa
          .from('profiles')
          .select('*')
          .or(receiverIdsArray.map(id => `user_id.eq.${id}`).join(','));
        
        // Attach profiles to requests
        sentRequests.forEach(req => {
          req.receiver = receiverProfiles?.find(p => p.user_id === req.receiver_id) || null;
        });
      }

      if (sentError) {
        console.error('Error fetching sent requests:', sentError);
        return NextResponse.json({ error: 'Failed to fetch sent requests' }, { status: 500 });
      }

      return NextResponse.json(sentRequests || []);
    } else if (type === 'received') {
      // Get received requests (pending)
      const { data: receivedRequests, error: receivedError } = await supa
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Get requester profiles
      if (receivedRequests && receivedRequests.length > 0) {
        const requesterIds = receivedRequests.map(req => req.requester_id);
        const requesterIdsArray = requesterIds.length > 0 ? requesterIds : ['00000000-0000-0000-0000-000000000000'];
        const { data: requesterProfiles } = await supa
          .from('profiles')
          .select('*')
          .or(requesterIdsArray.map(id => `user_id.eq.${id}`).join(','));
        
        // Attach profiles to requests
        receivedRequests.forEach(req => {
          req.requester = requesterProfiles?.find(p => p.user_id === req.requester_id) || null;
        });
      }

      if (receivedError) {
        console.error('Error fetching received requests:', receivedError);
        return NextResponse.json({ error: 'Failed to fetch received requests' }, { status: 500 });
      }

      return NextResponse.json(receivedRequests || []);
    } else {
      // Get all (sent + received pending requests)
      const { data: allRequests, error: allError } = await supa
        .from('friend_requests')
        .select('*')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Get all related profiles
      if (allRequests && allRequests.length > 0) {
        const allUserIds = [...new Set(allRequests.flatMap(req => [req.requester_id, req.receiver_id]))];
        const allUserIdsArray = allUserIds.length > 0 ? allUserIds : ['00000000-0000-0000-0000-000000000000'];
        const { data: allProfiles } = await supa
          .from('profiles')
          .select('*')
          .or(allUserIdsArray.map(id => `user_id.eq.${id}`).join(','));
        
        // Attach profiles to requests
        allRequests.forEach(req => {
          req.requester = allProfiles?.find(p => p.user_id === req.requester_id) || null;
          req.receiver = allProfiles?.find(p => p.user_id === req.receiver_id) || null;
        });
      }

      if (allError) {
        console.error('Error fetching requests:', allError);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
      }

      return NextResponse.json(allRequests || []);
    }
  } catch (error) {
    console.error('Friends API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Send a friend request
export async function POST(request: NextRequest) {
  try {
    const supa = getSupabaseForRequest(request);
    const { data: userRes } = await supa.auth.getUser();
    const userId = userRes.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiver_user_id } = await request.json();
    
    if (!receiver_user_id) {
      return NextResponse.json({ error: 'receiver_user_id is required' }, { status: 400 });
    }

    if (receiver_user_id === userId) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 });
    }

    // Check if request already exists
    const { data: existing } = await supa
      .from('friend_requests')
      .select('*')
      .or(`and(requester_id.eq.${userId},receiver_id.eq.${receiver_user_id}),and(requester_id.eq.${receiver_user_id},receiver_id.eq.${userId})`)
      .single();

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'Already friends' }, { status: 400 });
      }
      if (existing.status === 'pending' && existing.requester_id === userId) {
        return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 });
      }
      if (existing.status === 'pending' && existing.receiver_id === userId) {
        return NextResponse.json({ error: 'You have a pending request from this user' }, { status: 400 });
      }
    }

    // Create new friend request
    const { data: newRequest, error } = await supa
      .from('friend_requests')
      .insert({
        requester_id: userId,
        receiver_id: receiver_user_id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating friend request:', error);
      return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 });
    }

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Friends POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update friend request (accept/reject)
export async function PUT(request: NextRequest) {
  try {
    const supa = getSupabaseForRequest(request);
    const { data: userRes } = await supa.auth.getUser();
    const userId = userRes.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { request_id, action } = await request.json(); // action: 'accept' or 'reject'
    
    if (!request_id || !action) {
      return NextResponse.json({ error: 'request_id and action are required' }, { status: 400 });
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "accept" or "reject"' }, { status: 400 });
    }

    // Verify the request exists and user is the receiver
    const { data: friendRequest, error: fetchError } = await supa
      .from('friend_requests')
      .select('*')
      .eq('id', request_id)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !friendRequest) {
      return NextResponse.json({ error: 'Friend request not found or already processed' }, { status: 404 });
    }

    // Update the request
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { data: updatedRequest, error: updateError } = await supa
      .from('friend_requests')
      .update({ status: newStatus })
      .eq('id', request_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating friend request:', updateError);
      return NextResponse.json({ error: 'Failed to update friend request' }, { status: 500 });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Friends PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Cancel/Remove friend request or friendship
export async function DELETE(request: NextRequest) {
  try {
    const supa = getSupabaseForRequest(request);
    const { data: userRes } = await supa.auth.getUser();
    const userId = userRes.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const request_id = url.searchParams.get('id');
    
    if (!request_id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Verify user owns the request (sent it) or is involved
    const { data: friendRequest, error: fetchError } = await supa
      .from('friend_requests')
      .select('*')
      .eq('id', request_id)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .single();

    if (fetchError || !friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Only allow deletion if user sent the request (cancel) or if they want to remove friendship
    // For now, allow deletion of pending requests sent by user, or accepted requests by either party
    if (friendRequest.status === 'pending' && friendRequest.requester_id !== userId) {
      return NextResponse.json({ error: 'Cannot cancel requests you did not send' }, { status: 403 });
    }

    const { error: deleteError } = await supa
      .from('friend_requests')
      .delete()
      .eq('id', request_id);

    if (deleteError) {
      console.error('Error deleting friend request:', deleteError);
      return NextResponse.json({ error: 'Failed to delete friend request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Friends DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

